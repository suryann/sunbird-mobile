import { GroupMembersPage } from './../group-members/group-members';
import { Component } from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams
} from 'ionic-angular';
import { FormAndFrameworkUtilService } from '../../profile/formandframeworkutil.service';
import {
  CategoryRequest,
  Group,
  GroupService,
  InteractType,
  InteractSubtype,
  Environment,
  PageId,
  ImpressionType,
  ObjectType,
  SharedPreferences
} from 'sunbird';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { LoadingController } from 'ionic-angular';
import { GuestEditProfilePage } from '../../profile/guest-edit.profile/guest-edit.profile';
import { TelemetryGeneratorService } from '../../../service/telemetry-generator.service';
import { PreferenceKey } from '../../../app/app.constant';
import { CommonUtilService } from '../../../service/common-util.service';

@IonicPage()
@Component({
  selector: 'page-create-group',
  templateUrl: 'create-group.html',
})
export class CreateGroupPage {
  groupEditForm: FormGroup;
  classList = [];
  group: Group;
  isEditGroup = false;
  syllabusList: Array<any> = [];
  categories: Array<any> = [];
  loader: any;

  selectedLanguage = 'en';

  isFormValid = true;

  /* Options for class ion-select box */
  classOptions = {
    title: this.commonUtilService.translateMessage('CLASS').toLocaleUpperCase(),
    cssClass: 'select-box'
  };

  /* Options for syllabus ion-select box */
  syllabusOptions = {
    title: this.commonUtilService.translateMessage('SYLLABUS').toLocaleUpperCase(),
    cssClass: 'select-box'
  };
  constructor(
    private navCtrl: NavController,
    private fb: FormBuilder,
    private formAndFrameworkUtilService: FormAndFrameworkUtilService,
    private translate: TranslateService,
    private navParams: NavParams,
    private loadingCtrl: LoadingController,
    private commonUtilService: CommonUtilService,
    private groupService: GroupService,
    private preference: SharedPreferences,
    private telemetryGeneratorService: TelemetryGeneratorService
  ) {
    this.preference.getString(PreferenceKey.SELECTED_LANGUAGE_CODE)
      .then(val => {
        if (val && val.length) {
          this.selectedLanguage = val;
        }
      });

    this.group = this.navParams.get('groupInfo') || {};
    this.groupEditForm = this.fb.group({
      name: [this.group.name || '', Validators.required],
      syllabus: [this.group.syllabus && this.group.syllabus[0] || []],
      class: [this.group.grade || []]
    });
    console.log(this.groupEditForm);

    this.isEditGroup = this.group.hasOwnProperty('gid') ? true : false;
    this.getSyllabusDetails();


  }

  ionViewDidLoad() {
    this.telemetryGeneratorService.generateImpressionTelemetry(
      ImpressionType.VIEW, '',
      PageId.CREATE_GROUP_SYLLABUS_CLASS,
      Environment.USER, this.isEditGroup ? this.group.gid : '', this.isEditGroup ? ObjectType.GROUP : ''
    );

    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.TOUCH,
      this.isEditGroup ? InteractSubtype.EDIT_GROUP_INITIATED : InteractSubtype.CREATE_GROUP_INITIATED,
      Environment.USER,
      PageId.CREATE_GROUP
    );

  }


  ionViewWillEnter() {
    // this.getSyllabusDetails();
  }

  /**
   * get Syllabus Details and store locally
   */
  getSyllabusDetails() {
    this.loader = this.getLoader();
    this.loader.present();


    this.formAndFrameworkUtilService.getSyllabusList()
      .then((result) => {
        if (result && result !== undefined && result.length > 0) {
          result.forEach(element => {

            // renaming the fields to text, value and checked
            const value = { 'name': element.name, 'code': element.frameworkId };
            this.syllabusList.push(value);
          });

          if (this.group && this.group.syllabus && this.group.syllabus[0] !== undefined) {
            console.log('1', this.group.syllabus);
            this.getClassList(this.group.syllabus[0], false);
          } else {
            this.loader.dismiss();
          }
        } else {
          this.loader.dismiss();
          this.commonUtilService.showToast(this.commonUtilService.translateMessage('NO_DATA_FOUND'));
        }
      });
  }

  /**Navigates to guest edit profile */
  goToGuestEdit() {
    this.navCtrl.push(GuestEditProfilePage);
  }

  /**
   * Navigates to UsersList page
   */
  navigateToUsersList() {
    if (!this.isFormValid) {
      this.commonUtilService.showToast(this.commonUtilService.translateMessage('NEED_INTERNET_TO_CHANGE'));
      return;
    }

    const formValue = this.groupEditForm.value;
    console.log('formValue', formValue);
    if (formValue.name) {
      this.group.name = formValue.name;
      this.group.grade = (!formValue.class.length) ? [] : [formValue.class];
      this.group.syllabus = (!formValue.syllabus.length) ? [] : [formValue.syllabus];
      this.group.gradeValueMap = {};

      if (this.group.grade && this.group.grade.length > 0) {
        this.group.grade.forEach(gradeCode => {
          for (let i = 0; i < this.classList.length; i++) {
            if (this.classList[i].code === gradeCode) {
              this.group.gradeValueMap[this.classList[i].code] = this.classList[i].name;
              break;
            }
          }
        });
      }

      this.navCtrl.push(GroupMembersPage, {
        group: this.group
      });
    } else {
      this.commonUtilService.showToast(this.commonUtilService.translateMessage('ENTER_GROUP_NAME'));
    }
  }

  /**
 * Internally calls Update group API
 */
  updateGroup() {
    if (!this.isFormValid) {
      this.commonUtilService.showToast(this.commonUtilService.translateMessage('NEED_INTERNET_TO_CHANGE'));
      return;
    }

    const formValue = this.groupEditForm.value;
    if (formValue.name) {
      const loader = this.getLoader();
      loader.present();

      this.group.name = formValue.name;
      this.group.grade = (!formValue.class.length) ? [] : Array.isArray(formValue.class) ? formValue.class : [formValue.class];
      this.group.syllabus = (!formValue.syllabus.length) ? [] : [formValue.syllabus];
      this.group.gradeValueMap = {};

      if (this.group.grade && this.group.grade.length > 0) {
        this.group.grade.forEach(gradeCode => {
          for (let i = 0; i < this.classList.length; i++) {
            if (this.classList[i].code === gradeCode) {
              this.group.gradeValueMap[this.classList[i].code] = this.classList[i].name;
              break;
            }
          }
        });
      }

      this.groupService.updateGroup(this.group)
        .then((val) => {
          loader.dismiss();
          this.telemetryGeneratorService.generateInteractTelemetry(
            InteractType.OTHER,
            InteractSubtype.EDIT_GROUP_SUCCESS,
            Environment.USER,
            PageId.CREATE_GROUP
          );
          this.navCtrl.popTo(this.navCtrl.getByIndex(this.navCtrl.length() - 2));
        })
        .catch((error) => {
          loader.dismiss();
          console.log('Error : ' + error);
        });
    } else {
      this.commonUtilService.showToast(this.commonUtilService.translateMessage('ENTER_GROUP_NAME'));
    }
  }

  /**
   *
   * @param frameworkId
   * @param isSyllabusChanged
   */
  getClassList(frameworkId, isSyllabusChanged: boolean = true) {
    if (isSyllabusChanged) {
      this.loader = this.getLoader();
      this.loader.present();
    }

    frameworkId = frameworkId ? frameworkId : this.groupEditForm.value.syllabus;
    console.log('framework id', frameworkId);
    this.groupEditForm.patchValue({
      class: []
    });

    this.formAndFrameworkUtilService.getFrameworkDetails(frameworkId)
      .then((categories) => {
        const request: CategoryRequest = {
          currentCategory: 'gradeLevel',
          selectedLanguage: this.translate.currentLang
        };
        this.isFormValid = true;
        return this.formAndFrameworkUtilService.getCategoryData(request);
      })
      .then((classes) => {
        this.loader.dismiss();
        this.classList = classes;
        if (!isSyllabusChanged) {
          this.groupEditForm.patchValue({
            class: this.group.grade || []
          });
        }

      })
      .catch(error => {
        this.loader.dismiss();
        this.isFormValid = false;
        this.commonUtilService.showToast(this.commonUtilService.translateMessage('NEED_INTERNET_TO_CHANGE'));
        console.log('Error : ' + error);
      });
  }

  /**
   * Returns Loader Object
   */
  getLoader(): any {
    return this.loadingCtrl.create({
      duration: 30000,
      spinner: 'crescent'
    });
  }

}
